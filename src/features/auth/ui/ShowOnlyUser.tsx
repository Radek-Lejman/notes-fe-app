import { useSession } from "@entities/session";
import type { ShowOnlyUserProps } from "../model/types";

export const ShowOnlyUser = ({ children, fallback = null}: ShowOnlyUserProps) => {
    const { data: user } = useSession();
    const userId = user?.sub;

    if (!userId) {
        return <>{fallback}</>
    }

    return <>{children(user)}</>
}