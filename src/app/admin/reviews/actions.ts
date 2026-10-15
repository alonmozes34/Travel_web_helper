'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { reviewStoreFromEnv } from '@/lib/reviews/store';
import { dashboardAccess } from '@/lib/stats/dashboardAccess';

/**
 * The owner's two decisions on a review. The password is checked by the
 * proxy before the page is reached, and again here, because an action is a
 * request of its own.
 */
async function owner(): Promise<boolean> {
  return dashboardAccess((await headers()).get('authorization')) === 'ok';
}

const ID = /^[0-9a-f]{16}$/;

export async function approveReview(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '');
  if (!(await owner()) || !ID.test(id)) return;
  await reviewStoreFromEnv()?.approve(id);
  revalidatePath('/admin/reviews');
}

export async function removeReview(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '');
  if (!(await owner()) || !ID.test(id)) return;
  await reviewStoreFromEnv()?.remove(id);
  revalidatePath('/admin/reviews');
}
