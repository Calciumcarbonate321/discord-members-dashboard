import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { db } from "~/server/db"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function getUserFromDb(email: string, password: string) {
  const user = await db.user.findFirst({
    where: {
      email:email,
      password:password
    },
  })

  return user
}