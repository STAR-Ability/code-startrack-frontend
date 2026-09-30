import { readGateway } from "@/lib/api/gateway.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request) {
  return readGateway(request, "recommendation");
}

export {
  rejectHead as HEAD,
  localOptions as OPTIONS,
} from "@/lib/api/gateway.server";
