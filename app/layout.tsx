import type { Metadata } from "next"; import "./styles.css";
export const metadata:Metadata={title:"FRAME / Portfolio",description:"Cinematic stories, precisely cut."};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
