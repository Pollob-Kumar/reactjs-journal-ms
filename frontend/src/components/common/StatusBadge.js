import React from 'react';
import './StatusBadge.css';

const StatusBadge = ({ status }) => {
  const getStatusClass = (status) => {
    switch (status) {
      case 'Submitted':
      case 'Revised Submitted':
        return 'badge-info';
      case 'Under Review':
      case 'In Progress':
        return 'badge-warning';
      case 'Accepted':
      case 'Published':
      case 'Completed':
        return 'badge-success';
      case 'Rejected':
      case 'Declined':
        return 'badge-danger';
      case 'Revisions Required':
        return 'badge-warning';
      default:
        return 'badge-primary';
    }
  };

  return (
    <span className={`badge ${getStatusClass(status)}`}>
      {status}
    </span>
  );
};

export default StatusBadge;