//client/src/components/Login.jsx
import React from 'react'
import { useAppContext } from '../context/AppContext';
import toast from 'react-hot-toast';

const Login = () => {

    const { setShowUserLogin, loginUser, axios } = useAppContext()

    const [state, setState] = React.useState("login");
    const [name, setName] = React.useState("");
    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [loading, setLoading] = React.useState(false);

    const onSubmitHandler = async (event) => {
        event.preventDefault();
        if (loading) return; // prevent double submits while waiting
        setLoading(true);
        try {

            const payload = state === "register" ? { name, email, password } : { email, password };
            const { data } = await axios.post(`/api/user/${state}`, payload);
            if (data.success) {
                // Stay on the current page (e.g. the cart) after logging in
                loginUser(data.user)
                setShowUserLogin(false)
                toast.success(state === "register" ? "Account created" : "Logged in")

            } else {
                toast.error(data.message, { id: "login-error" })
            }
        } catch (error) {
            toast.error(error.message, { id: "login-error" })
        } finally {
            setLoading(false)
        }

    }

    return (
        <div onClick={() => setShowUserLogin(false)} className="fixed top-0 bottom-0 left-0 right-0 z-30 flex items-center text-sm text-gray-600 bg-black/50">

            <form onSubmit={onSubmitHandler} onClick={(e) => e.stopPropagation()} className="flex flex-col gap-7 m-auto items-start p-6 py-12 w-[90%] sm:w-[420px] rounded-lg shadow-xl border border-gray-200 bg-white">
                <p className="text-2xl font-medium m-auto">
                    <span className="text-primary">User</span> {state === "login" ? "Login" : "Sign Up"}
                </p>
                {state === "register" && (
                    <div className="w-full">
                        <p>Name</p>
                        <input onChange={(e) => setName(e.target.value)} value={name} placeholder="type here" className="border border-gray-200 rounded w-full p-2 mt-1 outline-primary" type="text" required />
                    </div>
                )}
                <div className="w-full ">
                    <p>Email</p>
                    <input onChange={(e) => setEmail(e.target.value)} value={email} placeholder="type here" className="border border-gray-200 rounded w-full p-2 mt-1 outline-primary" type="email" required />
                </div>
                <div className="w-full ">
                    <p>Password</p>
                    <input onChange={(e) => setPassword(e.target.value)} value={password} placeholder="type here" className="border border-gray-200 rounded w-full p-2 mt-1 outline-primary" type="password" minLength={state === "register" ? 6 : undefined} required />
                </div>
                {state === "register" ? (
                    <p>
                        Already have account? <span onClick={() => setState("login")} className="text-primary cursor-pointer">click here</span>
                    </p>
                ) : (
                    <p>
                        Create an account? <span onClick={() => setState("register")} className="text-primary cursor-pointer">click here</span>
                    </p>
                )}
                <button disabled={loading} className="bg-primary hover:bg-primary-dull transition-all text-white w-full py-2 rounded-md cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed">
                    {loading ? "Please wait..." : state === "register" ? "Create Account" : "Login"}
                </button>
            </form>
        </div>
    )
}

export default Login
