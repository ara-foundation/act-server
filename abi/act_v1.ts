export default [
    {
      "inputs": [],
      "name": "InvalidInitialization",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "NotInitializing",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        }
      ],
      "name": "OwnableInvalidOwner",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        }
      ],
      "name": "OwnableUnauthorizedAccount",
      "type": "error"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "projectId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "taskId",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "payload",
          "type": "string"
        }
      ],
      "name": "CancelTask",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "projectId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "taskId",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "address",
          "name": "contributor",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "payload",
          "type": "string"
        }
      ],
      "name": "CompleteTask",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "uint64",
          "name": "version",
          "type": "uint64"
        }
      ],
      "name": "Initialized",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "projectId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "taskId",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "checkAmount_",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "payload",
          "type": "string"
        }
      ],
      "name": "NewTask",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "previousOwner",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "OwnershipTransferred",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "projectId",
          "type": "uint256"
        }
      ],
      "name": "SetProject",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "projectId_",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "taskId_",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "payload_",
          "type": "string"
        }
      ],
      "name": "cancelTask",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "projectId_",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "taskId_",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "contributor_",
          "type": "address"
        },
        {
          "internalType": "string",
          "name": "payload_",
          "type": "string"
        }
      ],
      "name": "completeTask",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "developments",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "minted",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "cap",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "duration",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "taskId",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "initialize",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "maydone",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "projectId_",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "checkAmount_",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "duration_",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "payload_",
          "type": "string"
        }
      ],
      "name": "newTask",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "owner",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "renounceOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "sanghas",
      "outputs": [
        {
          "internalType": "address",
          "name": "ownership",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "maintainer",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "check",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "maydone_",
          "type": "address"
        }
      ],
      "name": "setMaydone",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "projectId_",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "checkLimit_",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "duration_",
          "type": "uint256"
        },
        {
          "components": [
            {
              "internalType": "address",
              "name": "ownership",
              "type": "address"
            },
            {
              "internalType": "address",
              "name": "maintainer",
              "type": "address"
            },
            {
              "internalType": "address",
              "name": "check",
              "type": "address"
            }
          ],
          "internalType": "struct SharedV1.Sangha",
          "name": "sangha_",
          "type": "tuple"
        }
      ],
      "name": "setProject",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "tasks",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "checkAmount",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "startTime",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "endTime",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "payload",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "transferOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
]