import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";
import React from "react";

const SideNav = () => {
  // Getting the session using the useSession hook
  const session = useSession();
  // Then getting the data if it exists, and from there the user
  const user = session.data?.user;

  return (
    <nav className="sticky top-0 px-2 py-4">
      <ul className="flex flex-col items-start gap-2 whitespace-nowrap">
        <li>
          <Link href="/">Home</Link>
        </li>
        {user != null && (
          <li>
            <Link href={`/profiles/${user.id}`}>Profile</Link>
          </li>
        )}
        {user == null ? (
          <li>
            {/* Because we are using typescript we need to specify that we do not care for the return of the signin/signout methods by adding void */}
            <button onClick={() => void signIn()}>Log In</button>
          </li>
        ) : (
          <li>
            <button onClick={() => void signOut()}>Log Out</button>
          </li>
        )}
      </ul>
    </nav>
  );
};

export default SideNav;
