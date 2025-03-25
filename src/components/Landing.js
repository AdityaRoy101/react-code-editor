import React, { useEffect, useState } from "react";
import CodeEditorWindow from "./CodeEditorWindow";
import axios from "axios";
import { classnames } from "../utils/general";
import { languageOptions } from "../constants/languageOptions";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { defineTheme } from "../lib/defineTheme";
import useKeyPress from "../hooks/useKeyPress";
import Footer from "./Footer";
import OutputWindow from "./OutputWindow";
import CustomInput from "./CustomInput";
import OutputDetails from "./OutputDetails";
import ThemeDropdown from "./ThemeDropdown";
import LanguagesDropdown from "./LanguagesDropdown";
var ConsistentHash = require('consistent-hash');

const p = process.env

const javascriptDefault = `/**
* Problem: Binary Search: Search a sorted array for a target value.
*/

// Time: O(log n)
const binarySearch = (arr, target) => {
 return binarySearchHelper(arr, target, 0, arr.length - 1);
};

const binarySearchHelper = (arr, target, start, end) => {
 if (start > end) {
   return false;
 }
 let mid = Math.floor((start + end) / 2);
 if (arr[mid] === target) {
   return mid;
 }
 if (arr[mid] < target) {
   return binarySearchHelper(arr, target, mid + 1, end);
 }
 if (arr[mid] > target) {
   return binarySearchHelper(arr, target, start, mid - 1);
 }
};

const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const target = 5;
console.log(binarySearch(arr, target));
`;

const Landing = () => {
  const [code, setCode] = useState(javascriptDefault);
  const [customInput, setCustomInput] = useState("");
  const [outputDetails, setOutputDetails] = useState(null);
  const [processing, setProcessing] = useState(null);
  const [theme, setTheme] = useState("cobalt");
  const [language, setLanguage] = useState(languageOptions[0]);
  const [serverString, setServerString] = useState(p.REACT_APP_API_URL_server1);
  // const [hashSignature, setHashSignature] = useState("");

  const enterPress = useKeyPress("Enter");
  const ctrlPress = useKeyPress("Control");

  // Function to encrypt hash with HMAC-SHA256
  async function encryptHash(timeHash, key) {
    // Convert the input strings to Uint8Arrays
    const encoder = new TextEncoder();
    const timeHashBuffer = encoder.encode(timeHash);
    const keyBuffer = encoder.encode(key);

    // Import the key for use with the Web Crypto API
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBuffer,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    // Generate the HMAC signature
    const signature = await crypto.subtle.sign(
      'HMAC',
      cryptoKey,
      timeHashBuffer
    );

    // Convert the signature to a base64 string
    return btoa(String.fromCharCode(...new Uint8Array(signature)));
  }

  // Generate time hash signature
  const generateTimeHashSignature = async () => {
    const currentDate = new Date();
    
    // Format date components with leading zeros
    const day = currentDate.getUTCDate().toString().padStart(2, '0');
    const hour = currentDate.getUTCHours().toString().padStart(2, '0');
    const minute = currentDate.getUTCMinutes().toString().padStart(2, '0');

    // Create time hash in format DDHHMI
    const timeHash = `${day}${hour}${minute}`;
    
    // Get encryption key from environment variable
    const encryptKey = p.REACT_APP_ENCRYPT_KEY || 'w2O5R4Bt';
    
    // Generate signature using the HMAC function
    const signature = await encryptHash(timeHash, encryptKey);
    
    // setHashSignature(signature);
    return signature;
  };

  const serverSelection = (server) => {
    if(server === 'server1')
      return p.REACT_APP_API_URL_server1
    else if(server === 'server2')
      return p.REACT_APP_API_URL_server2
    else if(server === 'server3')
      return p.REACT_APP_API_URL_server3
    else if(server === 'server4')
      return p.REACT_APP_API_URL_server4
    else if(server === 'server5')
      return p.REACT_APP_API_URL_server5
    else if(server === 'server6')
      return p.REACT_APP_API_URL_server6
    else if(server === 'server7')
      return p.REACT_APP_API_URL_server7
  }

  const selectServers = () => {
    var hr = new ConsistentHash("uniform")
    hr.add('server1')
    hr.add('server2')
    hr.add('server3')
    hr.add('server4')
    hr.add('server5')
    hr.add('server6')
    hr.add('server7')

    var serverToUse = hr.get('resourceName')
    setServerString(serverSelection(serverToUse))
    // console.log(serverToUse)
    // console.log(serverString)
  }

  const onSelectChange = (sl) => {
    console.log("selected Option...", sl);
    setLanguage(sl);
  };

  useEffect(() => {
    if (enterPress && ctrlPress) {
      console.log("enterPress", enterPress);
      console.log("ctrlPress", ctrlPress);
      handleCompile();
    }
  }, [ctrlPress, enterPress]);
  const onChange = (action, data) => {
    switch (action) {
      case "code": {
        setCode(data);
        break;
      }
      default: {
        console.warn("case not handled!", action, data);
      }
    }
  };
  const handleCompile = async () => {
    setProcessing(true);
    
    // Generate the hash signature
    const signature = await generateTimeHashSignature();
    
    const formData = {
      language_id: language.id,
      // encode source code in base64
      source_code: btoa(code),
      stdin: btoa(customInput)
    };
    
    selectServers();

    const options = {
      method: "POST",
      url: `https://my-worker-project.mr-adityaroy101.workers.dev/api/submissions`,
      params: { 
        base64_encoded: "true", 
        fields: "*",
        hashSignature: signature // Add hash signature as query parameter
      },
      headers: {
        "Content-Type": "application/json"
      },
      data: formData,
    };

    axios
      .request(options)
      .then(function (response) {
        // console.log("res.data", response.data);
        const token = response.data.token;
        checkStatus(token);
      })
      .catch((err) => {
        let error = err.response ? err.response.data : err;
        // get error status
        let status = err.response ? err.response.status : 500;
        console.log("status", status);
        if (status === 429) {
          console.log("too many requests", status);

          showErrorToast(
            `Quota of 100 requests exceeded for the Day!`,
            10000
          );
        }
        setProcessing(false);
        console.log("catch block...", error);
      });
  };

  const checkStatus = async (token) => {
    // Generate a fresh hash signature for this request
    const signature = await generateTimeHashSignature();
    
    const options = {
      method: "GET",
      url: `https://my-worker-project.mr-adityaroy101.workers.dev/api/submissions/` + token,
      params: { 
        base64_encoded: "true", 
        fields: "*",
        hashSignature: signature // Add hash signature as query parameter
      }
    };
    try {
      let response = await axios.request(options);
      let statusId = response.data.status?.id;

      // Processed - we have a result
      if (statusId === 1 || statusId === 2) {
        // still processing
        setTimeout(() => {
          checkStatus(token);
        }, 2000);
        return;
      } else {
        setProcessing(false);
        setOutputDetails(response.data);
        showSuccessToast(`Compiled Successfully!`);
        // console.log("response.data", response.data);
        return;
      }
    } catch (err) {
      console.log("err", err);
      setProcessing(false);
      showErrorToast();
    }
  };

  function handleThemeChange(th) {
    const theme = th;
    console.log("theme...", theme);

    if (["light", "vs-dark"].includes(theme.value)) {
      setTheme(theme);
    } else {
      defineTheme(theme.value).then((_) => setTheme(theme));
    }
  }
  useEffect(() => {
    defineTheme("oceanic-next").then((_) =>
      setTheme({ value: "oceanic-next", label: "Oceanic Next" })
    );
  }, []);

  const showSuccessToast = (msg) => {
    toast.success(msg || `Compiled Successfully!`, {
      position: "top-right",
      autoClose: 1000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
  };
  const showErrorToast = (msg, timer) => {
    toast.error(msg || `Something went wrong! Please try again.`, {
      position: "top-right",
      autoClose: timer ? timer : 1000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
  };

  return (
    <div>
      <ToastContainer
        position="top-right"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      <div className="h-4 w-full"></div>
      <div className="flex flex-row">
        <div className="px-4 py-2">
          <LanguagesDropdown onSelectChange={onSelectChange} />
        </div>
        <div className="px-4 py-2">
          <ThemeDropdown handleThemeChange={handleThemeChange} theme={theme} />
        </div>
      </div>
      {/* ==================================== */}
      
      <div className="flex flex-row space-x-4 items-start px-4 py-4">
        <div className="flex flex-col w-full h-full justify-start items-end">
          <CodeEditorWindow
            code={code}
            onChange={onChange}
            language={language?.value}
            theme={theme.value}
          />
        </div>
      {/* ==================================== */}

        <div className="right-container flex flex-shrink-0 w-[30%] flex-col">
          <OutputWindow outputDetails={outputDetails} />
          <div className="flex flex-col items-end">
            <CustomInput
              customInput={customInput}
              setCustomInput={setCustomInput}
            />
            <button
              onClick={handleCompile}
              disabled={!code}
              className={classnames(
                "mt-4 border-2 border-black z-10 rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0)] px-4 py-2 hover:shadow transition duration-200  bg-green-500 text-4xs text-white font-bold flex-shrink-0",
                !code ? "opacity-50" : ""
              )}
            >
              {processing ? "Processing..." : "Submit"}
            </button>
          </div>
          {outputDetails && <OutputDetails outputDetails={outputDetails} />}
        </div>
      {/* ==================================== */}

      </div>
      <Footer />
    </div>
  );
};
export default Landing;