import { SimpleListPage } from "../components/SimpleListPage";

export function Staff() {
  return (
    <SimpleListPage
      title="Staff"
      apiPath="/staff"
      columns={[
        { key: "name", label: "Name" },
        { key: "position", label: "Position" },
        { key: "monthly_salary", label: "Monthly salary", render: (r) => `₦${Number(r.monthly_salary).toLocaleString()}` },
      ]}
      formFields={[
        { key: "name", label: "Name", required: true },
        { key: "position", label: "Position" },
        { key: "bankName", label: "Bank name" },
        { key: "bankAccountNumber", label: "Bank account number" },
        { key: "monthlySalary", label: "Monthly salary", type: "number", required: true },
      ]}
    />
  );
}
