export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function statusColor(status) {
  if (status === "resolved") return "text-green-700 bg-green-100";
  if (status === "in_progress") return "text-blue-700 bg-blue-100";
  return "text-yellow-700 bg-yellow-100";
}

export function statusLabel(status) {
  if (status === "resolved") return "Resolved";
  if (status === "in_progress") return "In Progress";
  return "Pending";
}
