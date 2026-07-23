export const MOCK_USER = {
  name: "Sophea Keo",
  email: "sophea@smarteco.kh",
  avatar: "SK",
  points: 1250,
};

export const MY_REPORTS = [
  { id: "RPT-001", type: "Illegal Dumping", status: "resolved", date: "Jun 10, 2025", location: "Russey Keo" },
  { id: "RPT-002", type: "Overflowing Bin", status: "in_progress", date: "Jun 14, 2025", location: "Chroy Changvar" },
  { id: "RPT-003", type: "Hazardous Waste", status: "pending", date: "Jun 18, 2025", location: "Prek Leap" },
  { id: "RPT-004", type: "Litter", status: "resolved", date: "Jun 19, 2025", location: "Chbar Ampov" },
  { id: "RPT-005", type: "Construction Waste", status: "pending", date: "Jun 21, 2025", location: "Boeng Keng Kang" },
];

// `icon` is a lucide-react component name, resolved to an actual icon
// component in RecyclingGuidePage.jsx (real icons instead of emoji).
export const RECYCLE_CATEGORIES = [
  { name: "Plastic", icon: "Droplet", color: "bg-blue-50 border-blue-200", iconBg: "bg-blue-100", tips: ["Rinse containers before recycling", "Check the resin code (1–7)", "Flatten bottles to save space"], desc: "Plastic bottles, containers, and packaging can be recycled into new products.", image: "https://tse4.mm.bing.net/th/id/OIP.O8VEE9nKPpqdYD0IUjaMFAHaFF?r=0&rs=1&pid=ImgDetMain&o=7&rm=3" },
  { name: "Paper", icon: "Newspaper", color: "bg-yellow-50 border-yellow-200", iconBg: "bg-yellow-100", tips: ["Keep paper dry and clean", "Remove staples and tape", "Cardboard boxes should be flattened"], desc: "Newspapers, cardboard, and office paper are among the most recycled materials.", image: "https://tse4.mm.bing.net/th/id/OIP.j7bTKsV4xPTTNp0VkhYmLwHaE8?r=0&rs=1&pid=ImgDetMain&o=7&rm=3" },
  { name: "Glass", icon: "GlassWater", color: "bg-green-50 border-green-200", iconBg: "bg-green-100", tips: ["Remove lids and caps", "Rinse bottles and jars", "Do not include broken glass in bins"], desc: "Glass bottles and jars are 100% recyclable and can be recycled endlessly.", image: "https://th.bing.com/th/id/OIP.rVy4BEYayokDJbTfvlc2zwHaE8?r=0&o=7rm=3&rs=1&pid=ImgDetMain&o=7&rm=3" },
  { name: "Metal", icon: "Cylinder", color: "bg-gray-50 border-gray-200", iconBg: "bg-gray-100", tips: ["Rinse cans before recycling", "Aluminum is infinitely recyclable", "Steel cans can be collected separately"], desc: "Aluminum cans and steel tins are highly valuable recyclables.", image: "https://th.bing.com/th/id/OIP.SGpH-_tNu8i4sJ8CYmB42wHaE9?r=0&o=7rm=3&rs=1&pid=ImgDetMain&o=7&rm=3" },
  { name: "Electronics", icon: "Laptop", color: "bg-purple-50 border-purple-200", iconBg: "bg-purple-100", tips: ["Never throw e-waste in regular bins", "Remove batteries separately", "Find certified e-waste drop-off points"], desc: "E-waste contains valuable materials and hazardous substances requiring special handling.", image: "https://tse2.mm.bing.net/th/id/OIP.uAN3V5J0sCVHeM1bvJUqsAHaE8?r=0&rs=1&pid=ImgDetMain&o=7&rm=3" },
];

