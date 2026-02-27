import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Input from "../components/input.jsx";
import ButtonComponent from "../components/ButtonComponent.jsx";


function Login() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        email: "",
        password: ""
    });
    const [error, setError] = useState("");

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        setError("");
    };

    return (
        <div className="login-screen">
            <form className="login-card" onSubmit={handleSubmit}>
                <h1 className="login-title">Login</h1>
                <Input
                    className="login-input"
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Email"
                    required
                />
                <Input
                    className="login-input"
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Password"
                    required
                />
                {error ? <div className="input-error">{error}</div> : null}
                <ButtonComponent
                    className="login-button"
                    text="Login"
                    type="button"
                    onClick={handleSubmit}
                    api={{
                        path: "/api/auth/login",
                        method: "POST",
                        auth: false,
                        body: () => ({
                            username: form.email,
                            password: form.password
                        }),
                        onSuccess: (data) => {
                            if (data?.token) {
                                localStorage.setItem("token", data.token);
                            }
                            navigate("/dashboard");
                        },
                        onError: (err) => {
                            setError(err?.message || "Error en login");
                        }
                    }}
                    style={{ backgroundColor: "#6A6A6A", padding: "8px 30px" }}
                />
                <button
                    className="login-link"
                    type="button"
                    onClick={() => navigate("/register")}
                >
                    Create an account
                </button>
            </form>
        </div>
    );
}

export default Login;
