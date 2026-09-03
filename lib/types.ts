export type Project={id:string;folderId:string;title:string;summary:string;client?:string;year?:string;role?:string;thumbnail?:string;videoUrl?:string;featured:boolean;visible:boolean;order:number};
export type Folder={id:string;name:string;hidden:boolean;order:number};
export type PortfolioData={profile:{name:string;title:string;bio:string;about:string;email:string;heroImage?:string;profileImage?:string;skills:string[];socials:Record<string,string>;cvUrl?:string;cvVisible:boolean};folders:Folder[];projects:Project[];settings:{metaDescription:string;showContact:boolean}};
