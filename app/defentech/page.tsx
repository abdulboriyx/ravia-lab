import type { Metadata } from "next";
import NetworkExplorer from "./NetworkExplorer";

export const metadata: Metadata = {
  title: "Defentech — The U.S.–Israel Network | Ravia",
  description: "A visual research atlas of U.S.–Israel defense authority, financing, procurement, and technology. Explore documented links and open research questions."
};

export default function DefentechPage() {
  return <NetworkExplorer />;
}
