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
        <form onSubmit={handleSubmit} className='form'>
            <div className="email">
                <label htmlFor="email">Email: </label>
                <input type="email" name="email" value = {email} id="email" onChange={(e)=>{setEmail(e.target.value)}} required />
            </div>
            <div className="uname">
                <label htmlFor="username">username: </label>
                <input type="text" name="username" value = {userName} id="username" onChange={(e)=>{setUserName(e.target.value)}} required />
            </div>
            <div className='pword'>
                <label htmlFor="password">Password: </label>
                <input type="password" name="password" id="password" value = {password} onChange={(e)=>{setPassword(e.target.value)}} required />
            </div>
            {error && <div className="error-message">{error}</div>}
            <input type="submit" value="SignUp" />
            <span style={{ cursor: 'pointer', color: 'blue', marginLeft: '10px', textDecoration: 'underline' }}onClick={goToLogin}>Login</span>
        </form>
    );
};

export default SignupPage;
