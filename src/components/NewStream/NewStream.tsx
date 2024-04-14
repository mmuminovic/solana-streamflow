import { useState, FC, useEffect, useCallback } from "react";
import Button from "../UI-elements/Button/Button";
import TextInput from "../UI-elements/TextInput/TextInput";
import "./NewStream.css";
import NumberInput from "../UI-elements/NumberInput/NumberInput";
import Dropdown from "../UI-elements/Dropdown/Dropdown";
import { useWallet, useAnchorWallet } from "@solana/wallet-adapter-react";
// import { Connection } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { getBN, StreamflowSolana } from "@streamflow/stream";
import { RPC_CLUSTER_URL } from "../../constants/addresses";

interface NewStreamProps {
  setOpenNewStreamForm: (value: boolean) => void;
  setTransactionSignature: (value: string) => void;
}
interface Tokens {
  mint: string;
  amount: number;
  decimals: number;
  uiAmount: string;
  isNative: boolean;
}
interface FormState {
  token: Tokens | null;
  amount: string;
  walletAddress: string;
  contractName: string;
}

const NewStream: FC<NewStreamProps> = ({
  setOpenNewStreamForm,
  setTransactionSignature,
}) => {
  const wallet = useWallet();
  const anchorWallet = useAnchorWallet();
  const [loading, setLoading] = useState(false);
  const [tokens, setTokens] = useState<Tokens[]>([]);
  const [formState, setFormState] = useState<FormState>({
    token: null,
    amount: "0",
    walletAddress: "",
    contractName: "",
  });

  const handleDropdownChange = (selectedToken: string) => {
    const token = tokens.find((token) => token.mint === selectedToken);
    if (token) {
      setFormState({ ...formState, token: token });
    }
  };
  const getTokenAccounts = useCallback(async () => {
    if (!wallet?.publicKey) return;
    const solanaConnection = new StreamflowSolana.SolanaStreamClient(
      RPC_CLUSTER_URL
    ).getConnection();
    try {
      // const programAccounts = await solanaConnection.getProgramAccounts(
      //   wallet.publicKey
      // );
      const response = await solanaConnection.getParsedTokenAccountsByOwner(
        wallet.publicKey,
        { programId: TOKEN_PROGRAM_ID }
      );
      const result: Tokens[] = [];
      response.value.forEach((value) => {
        const commonPath = value.account.data.parsed.info;
        const mint = commonPath.mint;
        const uiAmount = commonPath.tokenAmount.uiAmountString;
        const amount = commonPath.tokenAmount.uiAmount;
        const isNative = commonPath.isNative;
        const decimals = commonPath.tokenAmount.decimals;
        if (amount > 0) {
          result.push({ mint, amount, uiAmount, decimals, isNative });
        }
      });
      setTokens(result);
    } catch (error) {
      console.log(error);
    }
  }, [wallet.publicKey]);

  useEffect(() => {
    if (wallet.connected) {
      getTokenAccounts();
    }
  }, [wallet.connected, getTokenAccounts]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    // const client = new StreamClient(RPC_CLUSTER_URL, Cluster.Devnet);
    const client = new StreamflowSolana.SolanaStreamClient(
      "https://api.mainnet-beta.solana.com"
    );
    const depositedAmount = getBN(
      Number(formState.amount),
      formState.token?.decimals || 0
    );
    const createStreamParams = {
      sender: anchorWallet,
      recipient: formState.walletAddress,
      mint: formState.token!.mint,
      start: Math.ceil(Date.now() / 1000) + 300,
      depositedAmount,
      period: 60,
      cliff: 0,
      cliffAmount: getBN(0, 9),
      amountPerPeriod: getBN(
        Number(formState.amount),
        formState.token?.decimals || 0
      ),
      name: formState.contractName,
      canTopup: false,
      cancelableBySender: true,
      cancelableByRecipient: true,
      transferableBySender: true,
      transferableByRecipient: false,
      automaticWithdrawal: false,
      withdrawalFrequency: 10,
      isNative: formState.token?.isNative || false,
      partner: null,
    };

    try {
      setLoading(true);
      // also returns metadata and ixs
      // @ts-ignore
      const { tx } = await client.create(createStreamParams);
      setLoading(false);
      setTransactionSignature(tx);
      setOpenNewStreamForm(false);
    } catch (exception) {
      setLoading(false);
      console.error("exception", exception);
    }
  };

  return (
    <div className="newStream">
      <div className="newStream_content">
        <p className="formTitle">CREATE NEW STREAM</p>
        <form onSubmit={handleSubmit}>
          <Dropdown
            label="Token"
            options={tokens}
            onChange={handleDropdownChange}
          />
          <TextInput
            label="Recipient Wallet Address"
            value={formState.walletAddress}
            onChange={(e) =>
              setFormState({ ...formState, walletAddress: e.target.value })
            }
            placeholder="Recipient Wallet Address"
            errorMessage="Wallet address is required"
            error={false}
          />
          <TextInput
            label="Contract Title"
            value={formState.contractName}
            onChange={(e) =>
              setFormState({ ...formState, contractName: e.target.value })
            }
            placeholder="Title"
            errorMessage="Contract title is required"
            error={false}
          />
          <NumberInput
            label="Amount"
            value={formState.amount}
            onChange={(e) =>
              setFormState({ ...formState, amount: e.target.value })
            }
            placeholder="e.g 0.001"
            errorMessage="Contract title is required"
            error={false}
          />
          <div className="form-actions">
            <Button
              label="Cancel"
              variant="secondary"
              onClick={() => setOpenNewStreamForm(false)}
            />
            <Button
              disabled={loading}
              label="Create"
              variant={loading ? "disabled" : "primary"}
              type="submit"
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewStream;
