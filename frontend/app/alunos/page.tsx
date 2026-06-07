import StudentPortal from "../StudentPortal";
import type { Database } from "@/lib/types";

const emptyPortalData: Database = {
  students: [],
  instructors: [],
  vehicles: [],
  enrollments: [],
  lessons: [],
  payments: [],
};

export default async function AlunosPage() {
  return <StudentPortal initialData={emptyPortalData} />;
}
