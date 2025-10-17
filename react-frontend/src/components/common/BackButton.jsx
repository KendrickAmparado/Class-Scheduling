import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';

const BackButton = ({ onClick }) => {
  return (
    <button className="back-button" onClick={onClick}>
      <FontAwesomeIcon icon={faArrowLeft} />
    </button>
  );
};

export default BackButton;