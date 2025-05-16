import { useEffect } from 'react';

const Contacts = () => {
  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);
    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

  return (
    <div className='Contacts_container'>
      <div className="Contacts">
        <div className="Contacts_header_text">Contacts</div>
        <div className='Contacts_content'>
          <div className='Contacts_content_desc'>
            <span>Coming soon!</span>
            <p></p>
            <span>Address books are currently under development.</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Styles
const styles = `
.Contacts_container {
  width: 100%;
  max-width: 800px;
  padding: 0 3%;
  padding-bottom: 30px;
  transition-duration: 500ms;
  font-family: Montserrat;
  margin: 0 auto;
}

.Contacts {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.Contacts_header_text {
  margin: 10px 0;
  text-align: center;
  color: white;
  font-size: 26px;
  font-family: Montserrat;
}

.Contacts_content {
  width: 100%;
  margin-top: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.Contacts_content_title {
  font-size: 23px;
  font-weight: bold;
  color: #29abe2;
  width: 100%;
  text-align: center;
}

.Contacts_content_desc {
  margin-top: 10px;
  font-size: 18px;
  color: #a3a3a3;
  width: 100%;
  text-align: center;
}
`;

export default Contacts;