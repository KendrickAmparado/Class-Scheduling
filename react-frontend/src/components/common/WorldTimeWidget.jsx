import React, { useEffect, useState } from 'react';
import axios from 'axios';

const WorldTimeWidget = ({ timezone = 'Etc/UTC' }) => {
  const [timeData, setTimeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    axios.get(`/api/public/time?timezone=${timezone}`)
      .then(res => {
        setTimeData(res.data);
        setError(null);
      })
      .catch(err => {
        setError('Failed to fetch time');
        setTimeData(null);
      })
      .finally(() => setLoading(false));
  }, [timezone]);

  if (loading) return <div>Loading time...</div>;
  if (error) return <div>{error}</div>;
  if (!timeData) return null;

  return (
    <div className="world-time-widget">
      <div><strong>Timezone:</strong> {timeData.timezone}</div>
      <div><strong>Current Time:</strong> {new Date(timeData.datetime).toLocaleString()}</div>
    </div>
  );
};

export default WorldTimeWidget;
