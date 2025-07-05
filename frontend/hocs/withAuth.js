import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect } from "react";

const withAuth = (WrappedComponent, allowedRoles) => {
  const Wrapper = (props) => {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
      if (status === "unauthenticated" || !allowedRoles.includes(session?.user?.role)) {
        router.push("/auth/login"); // Redirect to login if not authenticated or unauthorized
      }
    }, [status, session, router]);

    if (status === "loading") {
      return <p>Loading...</p>; // Show a loading state while checking authentication
    }

    if (!session || !allowedRoles.includes(session.user.role)) {
      return null; // Return nothing if unauthorized (redirect will happen in useEffect)
    }

    return <WrappedComponent {...props} />;
  };

  // Set a display name for the HOC for better debugging
  Wrapper.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name || "Component"})`;

  return Wrapper;
};

export default withAuth;