import StudentPortal from "../StudentPortal";
import { readDatabase } from "@/lib/store";

export default async function AlunosPage() {
  const database = await readDatabase();

  return <StudentPortal initialData={database} />;
}
