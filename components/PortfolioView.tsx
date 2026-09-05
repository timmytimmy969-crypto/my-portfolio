import Link from "next/link";
import type { PortfolioData } from "@/lib/types";

const mediaStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
};

const instagramUrl = "https://www.instagram.com/that_camera_guyy";
const tiktokUrl = "https://www.tiktok.com/@that_camera_guyy";

export default function PortfolioView({ portfolio: p, slug }: { portfolio: PortfolioData; slug: string; }) {
  return (
    <main>
      <nav><a className="brand" href="#top">FRAME<span>·</span></a><div><a href="#about">About</a><a href="#work">Work</a><a href="#contact">Contact</a></div></nav>
      <section id="top" className="hero">
        {p.profile.heroImage && <img src={p.profile.heroImage} alt="" aria-hidden="true" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",zIndex:0}} />}
        <div style={{position:"absolute",inset:0,background:"linear-gradient(90deg,rgba(8,8,8,.95),rgba(8,8,8,.32))",zIndex:1}} />
        <div style={{position:"relative",zIndex:2}}><p className="eyebrow">{p.profile.title}</p><h1>{p.profile.name}</h1><p className="lede">{p.profile.bio}</p><a className="button" href="#work">Explore selected work</a></div><span className="hero-index">01 / 04</span>
      </section>
      <section id="about" className="about"><p className="eyebrow">About</p><h2>Stories that stay<br/>with you.</h2><p>{p.profile.about}</p><div className="skills">{p.profile.skills.map(s=><span key={s}>{s}</span>)}</div></section>
      <section id="work" className="work">
        <div className="section-heading"><p className="eyebrow">Selected work</p><h2>Built frame by frame.</h2></div>
        <div className="folder-nav">{p.folders.filter(f=>!f.hidden).map(f=><a href={`#${f.id}`} key={f.id}>{f.name}</a>)}</div>
        {p.folders.filter(f=>!f.hidden).map(f=><div id={f.id} className="folder" key={f.id}>
          <h3><span className="folder-title-highlight">{f.name}</span></h3>
          <div className="projects">{p.projects.filter(x=>x.folderId===f.id&&x.visible).sort((a,b)=>a.order-b.order).map((x,i)=><Link href={`/portfolio/${slug}/project/${x.id}`} className="card" key={x.id}>
            <div className="thumb">{x.thumbnail&&<img src={x.thumbnail} alt="" style={mediaStyle}/>}<span>0{i+1}</span></div>
            <div><h4>{x.title}</h4><p className="project-meta"><span className="role-highlight">{x.role || "Creative"}</span>{x.year && <span className="project-year">{x.year}</span>}</p></div>
          </Link>)}</div>
        </div>)}
      </section>
      <section id="contact" className="contact"><p className="eyebrow">Let’s create</p><h2>Have a story<br/>to tell?</h2><a href={`mailto:${p.profile.email}`}>{p.profile.email}</a><div className="social-links"><a href={instagramUrl} target="_blank" rel="noopener noreferrer">Instagram ↗</a><a href={tiktokUrl} target="_blank" rel="noopener noreferrer">TikTok ↗</a></div>{p.profile.cvVisible&&p.profile.cvUrl&&<a className="button outline" href={p.profile.cvUrl}>Download CV</a>}</section>
      <footer>© {new Date().getFullYear()} {p.profile.name} <span>Made with intention</span></footer>
    </main>
  );
}
