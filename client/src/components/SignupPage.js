import React, {useState} from 'react';
import { useNavigate } from 'react-router-dom';
import './SignupPage.css';
import config from "../config.json"

function SignupPage() {
    const [email, setEmail] = useState("");
    const [userName, setUserName] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();

        const details = {
            email : email,
            username: userName,
            password: password
        };

        const url = `http://${config.HOST}:${config.PORT}/signup`
        
        try
        {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(details)
            })

            if (!response.ok) {
                const errorData = await response.json();
                setError(errorData.error);
                return;
            }

            navigate('/login');
        } 
        catch (error) 
        {
            console.error('There was a problem with the fetch operation:', error);
        }
    }

    const goToLogin = ()=>{
        navigate('/login');
    }

    return (
<form onSubmit={handleSubmit} className='formS'>
    <h2 className='form-titleS'>Sign Up</h2>
    <div className="form-groupS">
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
    <div className="form-groupS">
        <label htmlFor="username">Username</label>
        <input 
            type="text" 
            name="username" 
            id="username" 
            value={userName} 
            onChange={(e) => setUserName(e.target.value)} 
            required 
            placeholder="Enter your username" 
        />
    </div>
    <div className='form-groupS'>
        <label htmlFor="password">Password</label>
        <input 
            type="password" 
            name="password" 
            id="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            placeholder="Enter your password" 
        />
    </div>
    {error && <div className="error-messageS">{error}</div>}
    <div className='form-actionsS'>
        <input type="submit" value="Sign Up" />
        <span className='login-linkS' onClick={goToLogin}>Login</span>
    </div>
</form>


    );
};

export default SignupPage;
