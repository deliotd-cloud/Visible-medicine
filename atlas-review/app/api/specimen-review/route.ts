import { env } from "cloudflare:workers";
import {
  getSpecimenReviews,
  postSpecimenReview,
} from "@/atlas-review/lib/specimen-review-api";
export const dynamic = "force-dynamic";
export const GET = (request: Request) => getSpecimenReviews(request, env.DB.withSession('first-primary') as unknown as D1Database);
export const POST = (request: Request) => postSpecimenReview(request, env.DB.withSession('first-primary') as unknown as D1Database);
