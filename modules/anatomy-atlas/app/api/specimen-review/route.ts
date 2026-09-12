import { env } from "cloudflare:workers";
import {
  getSpecimenReviews,
  postSpecimenReview,
} from "@/lib/specimen-review-api";
export const dynamic = "force-dynamic";
export const GET = (request: Request) => getSpecimenReviews(request, env.DB);
export const POST = (request: Request) => postSpecimenReview(request, env.DB);
