import { CircleDot, Orbit, ScanLine, Waves } from "lucide-react";

export const PLAN_IDENTITIES = {
  no_access: {
    labelKey: "usersPage.no_accessPlan",
    icon: CircleDot,
    tone: "unassigned",
  },
  signals: {
    labelKey: "usersPage.signalsPlan",
    icon: ScanLine,
    tone: "scope",
  },
  whatsapp: {
    labelKey: "usersPage.whatsappPlan",
    icon: Waves,
    tone: "kairos",
  },
  complete: {
    labelKey: "usersPage.completePlan",
    icon: Orbit,
    tone: "cosmos",
  },
};
