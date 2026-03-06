// 1. Add this state at the top of your component
const [emailSent, setEmailSent] = useState(false);

// 2. After successful signup, set it:
setEmailSent(true);

// 3. Add this BEFORE your return statement:
if (emailSent) return (
  <div style={{display:'flex',flexDirection:'column',alignItems:'center',
    justifyContent:'center',height:'100vh',background:'#0f0f0f',padding:32,textAlign:'center'}}>
    <div style={{fontSize:64,marginBottom:16}}>✉️</div>
    <h2 style={{color:'#fff',fontSize:24,fontWeight:800,margin:'0 0 8px'}}>Check your email!</h2>
    <p style={{color:'#aaa',fontSize:15,lineHeight:1.6,margin:'0 0 8px'}}>
      We sent a confirmation link to
    </p>
    <p style={{color:'#E8472A',fontWeight:700,fontSize:16,margin:'0 0 24px'}}>{email}</p>
    <p style={{color:'#666',fontSize:13}}>Click the link to confirm, then come back to sign in.</p>
    <button onClick={()=>{setEmailSent(false);setIsSignUp(false);}}
      style={{marginTop:28,padding:'14px 32px',borderRadius:28,border:'none',
        background:'linear-gradient(135deg,#E8472A,#FF7043)',color:'#fff',
        fontWeight:700,fontSize:15,cursor:'pointer'}}>
      Go to Sign In ✈️
    </button>
  </div>
);
