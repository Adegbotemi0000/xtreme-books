import { SimpleListPage } from "../components/SimpleListPage";

export function Projects() {
  return (
    <SimpleListPage
      title="Projects"
      apiPath="/projects"
      hideDelete
      columns={[
        { key: "name", label: "Name" },
        { key: "code", label: "Code" },
        { key: "status", label: "Status" },
        { key: "budget", label: "Budget", render: (r) => (r.budget ? `₦${Number(r.budget).toLocaleString()}` : "—") },
      ]}
      formFields={[
        { key: "name", label: "Name", required: true },
        { key: "code", label: "Code" },
        { key: "status", label: "Status (active/completed/on_hold)" },
        { key: "budget", label: "Budget", type: "number" },
      ]}
    />
  );
}
