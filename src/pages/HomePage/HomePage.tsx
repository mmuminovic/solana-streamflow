import { useState } from "react";
import "./HomePage.css";
import Header from "../../components/Header/Header";
import NewStream from "../../components/NewStream/NewStream";
import DisplayStreams from "../../components/DisplayStreams/DisplayStreams";
import ConfirmationModal from "../../components/ConfirmationModal/ConfirmationModal";

const HomePage = () => {
  const [openNewStreamForm, setOpenNewStreamForm] = useState(false);
  const [transactionSignature, setTransactionSignature] = useState("");
  return (
    <div className="homePage">
      <Header />
      <div className="homePage_content">
        {!!transactionSignature && (
          <ConfirmationModal
            transactionSignature={transactionSignature}
            setTransactionSignature={setTransactionSignature}
          />
        )}
        {openNewStreamForm ? (
          <div className="newStream-wrapper">
            <NewStream
              setOpenNewStreamForm={setOpenNewStreamForm}
              setTransactionSignature={setTransactionSignature}
            />
          </div>
        ) : (
          <DisplayStreams setOpenNewStreamForm={setOpenNewStreamForm} />
        )}
      </div>
    </div>
  );
};

export default HomePage;
