import React, {useState} from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css'
import config from '../config.json';

function LoginPage(){
    const [email, setEmail] = useState("");
    const [Password, setPassword] = useState("");
    const [iscorrectPassword, setIscorrectPassword] = useState(true);

    const navigate = useNavigate();

    const handleSubmit = async(e) => {
        e.preventDefault();

        const loginDetails = {
            "email": email,
            "password": Password
        };

        const url = `http://${config.HOST}:${config.PORT}/login`

        try{
            const response = await fetch(url, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'}, 
                body: JSON.stringify(loginDetails),
                credentials: 'include'
            });

            if(response.ok)
            {
                setTimeout(() => navigate('/welcome'), 100);
            }
            else
            {
                const errorData = await response.json();
                console.log(response.status);
                if(response.status === 400)
                {
                    setIscorrectPassword(false);
                }

                throw new Error(errorData.error);
            }
        }
        catch(err)
        {
            console.error("LoginPage fetch error:", err);
        }
    };

    const toSignupPage = () => {
        navigate('/');
    };

    return (
        <form onSubmit={handleSubmit} className='formL'>
            <h2 className='form-titleL'>Login</h2>
            <div className="form-groupL">
                <label htmlFor="email">Email</label>
                <input 
                    type="email" 
                    name="email" 
                    id="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                    placeholder="Enter your email" 
                />
            </div>
            <div className='form-groupL'>
                <label htmlFor="password">Password</label>
                <input 
                    type="password" 
                    name="password" 
                    id="password" 
                    value={Password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                    placeholder="Enter your password" 
                />
            </div>
            <div className='form-actionsL'>
                <input type="submit" value="Login" />
                <span className='register-linkL' onClick={toSignupPage}>Register?</span>
            </div>
            <div className='error-messageL'>{iscorrectPassword ? "" : "Incorrect Password! Try Again."}</div>
        </form>
    )
}

export default LoginPage;