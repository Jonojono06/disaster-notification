function Alert({ location, magnitude }) {
    return (
      <div style={{ border: '1px solid #ccc', margin: '10px', padding: '10px' }}>
        <p><strong>Location:</strong> {location}</p>
        <p><strong>Magnitude:</strong> {magnitude}</p>
      </div>
    );
  }
  
  export default Alert;