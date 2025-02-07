
import { useEffect, useState } from 'react'

import { supabase } from "../supabaseClient"

function App() {

  const [session, setSession] = useState([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  console.log(session)

  // sign in
  const signIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
    })
  }

  // sign out
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
  }

  if(!session) {
    return (
      <div className="w-full flex h-screen justify-center items-center">
        <button onClick={signIn}>Sign in with Google</button>
      </div>
    )
  } else {
    return (
      <div className="w-full flex h-screen justify-center items-center p-4">
        <div className="border-[1px] border-gray-700 max-w-6xl w-full min-h-[600px] rounded-lg">
          {/* Header */}
          <div className="flex justify-between h-20 border-b-[1px] border-gray-700">
            <div className="p-4">
              <p className="text-gray-300">signed in as name {session?.user?.user_metadata?.full_name}</p>
              <p className="text-gray-300 italic text-sm">3 user login</p>
            </div>
            <button onClick={signOut} className="m-2 sm:mr-4">Sign out</button>
          </div>
          {/* main chat */}
          <div className=""></div>
          {/* message input */}
          <form className="flex flex-col sm:flex-row p-4 border-t-[1px] border-gray-700">
            <input type="text" placeholder="Type a message..." className="p-2 w-full bg-[#00000040] rounded-lg"/>
            <button className="mt-4 sm:mt-0 sm:ml-8 text-white max-h-12">Send</button>
          </form>
        </div>
      </div>
    )
  }
 

  
}

export default App
