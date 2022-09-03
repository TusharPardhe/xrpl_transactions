import { useState } from "react";
import DatePicker from "react-datepicker";
import { XrplClient } from "xrpl-client";
import { ToastContainer, toast } from 'react-toastify';
import { JsonToExcel } from "react-json-to-excel";

import edit from "./assets/editions.png"

import "react-datepicker/dist/react-datepicker.css";
import 'react-toastify/dist/ReactToastify.css';
import "./App.css";

function App() {
  let prevDate = new Date().setDate(new Date().getDate() - 1);
  const [lastDate, setLastDate] = useState(prevDate);
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);


  const hex2a = (hex) => {
    var str = '';
    for (var i = 0; i < hex.length; i += 2)
      str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    return str.replaceAll("\u0000", "");
  }

  const onBtnClick = async () => {
    setLoading(true);
    let exitTxs = false;
    let data = [];

    try {
      const client = new XrplClient("wss://xrplcluster.com");
      await client.ready();

      (async function getTransactions(marker) {
        console.log(`Fetching...`);
        const payload = {
          "command": "account_tx",
          "account": address.trim(),
          "limit": 200,
        };

        if (marker) {
          payload.marker = marker;
        } else if (typeof marker === undefined) {
          return;
        }

        const response = await client.send({
          "command": "account_tx",
          "account": address,
          "binary": false,
          "limit": 200,
          "forward": false
        });

        if (response.error_message) {
          throw response;
        };

        response.transactions.forEach(tx => {
          const txDate = (tx.tx.date + 946684800) * 1000;
          const payment = tx.tx.TransactionType === "Payment";

          if (txDate >= lastDate && payment) {
            let amount = {};

            if (typeof tx.tx.Amount === "string") {
              amount.currency = "XRP";
              amount.value = (tx.tx.Amount / Math.pow(10, 6)).toString();
            } else {
              amount = { ...tx.tx.Amount };
              amount.currency = amount.currency.length === 40 ? hex2a(tx.tx.Amount.currency) : amount.currency;
            };
            delete tx.tx.Amount;
            delete tx.tx.date;

            data.push({
              ...amount, date: new Date(txDate).toLocaleString(undefined, {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric',
                hour: 'numeric',
                minute: 'numeric',
                second: 'numeric'
              }), ...tx.tx, TransactionResult: tx.meta.TransactionResult
            })
          } else {
            exitTxs = true;
          }
        });

        if (!exitTxs) {
          getTransactions(response.marker);
        } else {
          setTransactions(data);
          setLoading(false);
        }
        return;
      })(null);

    } catch (error) {
      console.log(error);
      toast(error.error_message);
      setLoading(false);
    }
  };

  const onAddressChange = (e) => {
    const { value } = e.target;
    setAddress(value);
  }

  return (
    <div className="App">
      <ToastContainer />
      <div>
        <div>
          <img src={edit} className="logo" alt="Vite logo" />
        </div>
      </div>
      <div className="inputs">
        <div className="input">
          <h2 className="heading">Enter Account Address</h2>
          <input value={address} onChange={onAddressChange} disabled={loading} />
        </div>
        <div className="input">
          <h2 className="heading">Select Transactions Start Date</h2>
          <DatePicker selected={lastDate} onChange={(date) => setLastDate(date)} maxDate={prevDate} disabled={loading} />
        </div>
      </div>
      <div className="btn">
        {address.length > 0 && (<div><button onClick={onBtnClick} disabled={loading}>Fetch</button></div>)}
        {!loading && address.length > 0 && transactions.length > 0 && (
          <JsonToExcel
            title="Download Excel"
            data={transactions}
            fileName="payment_transactions"
            btnClassName="btnClass"
          />
        )}
      </div>
      {loading && <Loader/>}
    </div>
  );
}

export default App;

const Loader = () => {
  return (
    <div class="loading">Loading&#8230;</div>
  )
}