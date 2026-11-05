"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import * as questions from "@/lib/data/questions";
import * as advisors from "@/lib/data/advisors";
import * as events from "@/lib/data/events";
import * as groups from "@/lib/data/groups";

// Server actions are independently reachable POST endpoints — a page-level
// check does not cover them. So every function here stays thin and does no
// authorization of its own: it parses the form, delegates to the DAL (which
// authenticates and checks ownership), and revalidates. If a check is missing,
// it is missing in one place instead of twelve.

const str = (data: FormData, key: string) => String(data.get(key) ?? "");

// --- Q&A -------------------------------------------------------------------

export async function createQuestionAction(formData: FormData) {
  const { id } = await questions.createQuestion({
    title: str(formData, "title"),
    body: str(formData, "body"),
    tagSlugs: formData.getAll("tags").map(String).filter(Boolean),
  });

  revalidatePath("/questions");
  redirect(`/questions/${id}`);
}

export async function createAnswerAction(formData: FormData) {
  const questionId = str(formData, "questionId");
  await questions.createAnswer({ questionId, body: str(formData, "body") });
  revalidatePath(`/questions/${questionId}`);
}

export async function createCommentAction(formData: FormData) {
  const questionId = str(formData, "questionId");
  const answerId = str(formData, "answerId");

  await questions.createComment({
    body: str(formData, "body"),
    questionId: questionId || undefined,
    answerId: answerId || undefined,
  });

  revalidatePath(`/questions/${str(formData, "threadId")}`);
}

export async function voteQuestionAction(formData: FormData) {
  const questionId = str(formData, "questionId");
  if (!questionId) return;

  await questions.toggleQuestionVote(questionId);

  revalidatePath(`/questions/${questionId}`);
  revalidatePath("/questions");
}

export async function voteAnswerAction(formData: FormData) {
  const answerId = str(formData, "answerId");
  if (!answerId) return;

  await questions.toggleAnswerVote(answerId);

  const questionId = str(formData, "questionId");
  if (questionId) revalidatePath(`/questions/${questionId}`);
}

export async function acceptAnswerAction(formData: FormData) {
  const { questionId } = await questions.acceptAnswer(str(formData, "answerId"));
  revalidatePath(`/questions/${questionId}`);
}

// --- Advisors --------------------------------------------------------------

export async function bookOfferingAction(formData: FormData) {
  const { advisorSlug } = await advisors.createBooking({
    offeringId: str(formData, "offeringId"),
    slotId: str(formData, "slotId"),
    note: str(formData, "note"),
  });

  revalidatePath(`/mentors/${advisorSlug}`);
  revalidatePath("/bookings");
  redirect("/bookings");
}

export async function cancelBookingAction(formData: FormData) {
  await advisors.cancelBooking(str(formData, "bookingId"));
  revalidatePath("/bookings");
  revalidatePath("/mentors");
}

export async function createReviewAction(formData: FormData) {
  await advisors.createReview({
    bookingId: str(formData, "bookingId"),
    rating: Number(formData.get("rating") ?? 0),
    body: str(formData, "body"),
  });

  revalidatePath("/bookings");
  revalidatePath("/mentors");
}

// --- Events ----------------------------------------------------------------

export async function toggleRsvpAction(formData: FormData) {
  await events.toggleRsvp(str(formData, "eventSlug"));
  revalidatePath("/events");
  revalidatePath("/");
}

// --- Groups ----------------------------------------------------------------

export async function joinGroupAction(formData: FormData) {
  const slug = str(formData, "groupSlug");
  await groups.joinGroup(slug);
  revalidatePath("/groups");
  revalidatePath(`/groups/${slug}`);
}

export async function leaveGroupAction(formData: FormData) {
  const slug = str(formData, "groupSlug");
  await groups.leaveGroup(slug);
  revalidatePath("/groups");
  revalidatePath(`/groups/${slug}`);
}

export async function createGroupPostAction(formData: FormData) {
  const slug = str(formData, "groupSlug");
  await groups.createGroupPost({
    groupSlug: slug,
    title: str(formData, "title"),
    body: str(formData, "body"),
  });
  revalidatePath(`/groups/${slug}`);
}

export async function createGroupCommentAction(formData: FormData) {
  const slug = str(formData, "groupSlug");
  await groups.createGroupComment({
    groupSlug: slug,
    postId: str(formData, "postId"),
    body: str(formData, "body"),
  });
  revalidatePath(`/groups/${slug}`);
}

export async function deleteGroupPostAction(formData: FormData) {
  const slug = str(formData, "groupSlug");
  await groups.deleteGroupPost({ groupSlug: slug, postId: str(formData, "postId") });
  revalidatePath(`/groups/${slug}`);
}
