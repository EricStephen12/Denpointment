import { redirect } from "next/navigation";
import { getCurrentPerson, isAdmin, isReceptionist, isDentist } from "@/lib/auth";
import AdminDashboard from "@/components/dashboards/AdminDashboard";
import ReceptionistDashboard from "@/components/dashboards/ReceptionistDashboard";
import DentistDashboard from "@/components/dashboards/DentistDashboard";
import PatientDashboard from "@/components/dashboards/PatientDashboard";

export default async function DashboardRouter() {
  const dbUser = await getCurrentPerson();
  if (!dbUser) redirect("/");

  // Routing logic based on roles
  const content = (() => {
    if (isAdmin(dbUser)) return <AdminDashboard user={dbUser} />;
    if (isReceptionist(dbUser)) return <ReceptionistDashboard user={dbUser} />;
    if (isDentist(dbUser)) return <DentistDashboard user={dbUser} />;
    return <PatientDashboard user={dbUser} />;
  })();

  return (
    <div>
      {content}
    </div>
  );
}
