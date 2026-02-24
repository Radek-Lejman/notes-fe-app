import type { ReactNode } from "react";
import { useSession, type User } from "@entities/session";

export interface ShowOnlyUserProps {
  children: (user: User) => ReactNode;
  fallback?: ReactNode;
}


export const ShowOnlyUser = ({ children, fallback = null}: ShowOnlyUserProps) => {
    const { data: user } = useSession();
    const userId = user?.sub;

    if (!userId) {
        return <>{fallback}</>
    }

    return <>{children(user)}</>
}