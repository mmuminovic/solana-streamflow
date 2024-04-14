import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import "./Header.css";

const Header = () => {
  return (
    <div className="header">
      <div className="header_content">
        <WalletMultiButton />
      </div>
    </div>
  );
};

export default Header;
