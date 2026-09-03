import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
const key = new TextEncoder().encode(process.env.AUTH_SECRET || "development-secret-change-me-please-32");
export async function createSession(userId:string){return new SignJWT({sub:userId}).setProtectedHeader({alg:"HS256"}).setIssuedAt().setExpirationTime("7d").sign(key)}
export async function currentUserId(){const token=(await cookies()).get("frame_session")?.value;if(!token)return null;try{return (await jwtVerify(token,key)).payload.sub || null}catch{return null}}
