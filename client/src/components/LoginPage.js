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
        <form onSubmit={handleSubmit} className='form'>
        <div className="email">
            <label htmlFor="email">Email: </label>
            <input type="email" name="email" value = {email} id="email" onChange={(e)=>{setEmail(e.target.value)}} required />
        </div>
        <div className='pword'>
            <label htmlFor="password">Password: </label>
            <input type="password" name="password" id="password" value = {Password} onChange={(e)=>{setPassword(e.target.value)}} required />
        </div>
        <input type="submit" value="Login" />
        <span style={{ cursor: 'pointer', color: 'blue', marginLeft: '10px', textDecoration: 'underline' }} onClick={toSignupPage}>Register?</span>
        <div>{iscorrectPassword ? "" : "Incorrect Password! Try Again."}</div>
    </form>
    )
}

export default LoginPage;