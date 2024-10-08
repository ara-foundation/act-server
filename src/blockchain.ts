import {
    Contract,
    JsonRpcProvider,
    Wallet,
  } from 'ethers'
  import { erc20Abi } from './abis'
  import actV1Abi from '../abi/act_v1'
  
export const providers: { [key: number]: JsonRpcProvider } = {
    // 11155111: new JsonRpcProvider(process.env.RPC_URL_11155111!),
    // 137: new JsonRpcProvider(process.env.RPC_URL_137!),
    // 56: new JsonRpcProvider(process.env.RPC_URL_56!),
    97: new JsonRpcProvider(process.env.RPC_URL_97!),
}
  
export const signers: { [key: number]: Wallet } = {
    // 11155111: new Wallet(process.env.PRIVATE_KEY_11155111!),
    // 137: new Wallet(process.env.PRIVATE_KEY_137!),
    // 56: new Wallet(process.env.PRIVATE_KEY_56!),
    97: new Wallet(process.env.PRIVATE_KEY_97!),
}
  
const actV1: { [key: number]: Contract } = {
    // 11155111: new Contract(process.env.ARA_V1_ADDRESS_11155111!, actV1Abi, providers[11155111]),
    // 137: new Contract(process.env.ARA_V1_ADDRESS_137!, actV1Abi, providers[137]),
    // 56: new Contract(process.env.ARA_V1_ADDRESS_56!, actV1Abi, providers[56]),
    97: new Contract(process.env.ARA_V1_ADDRESS_97!, actV1Abi, providers[97]),
}

const nativeSymbol: {[key: number]: string} = {
  97: 'tBNB',
}
  
export const symbolOf = async(tokenAddr: string, networkId: number): Promise<string> => {
  if (tokenAddr === '0x0000000000000000000000000000000000000000') {
    return nativeSymbol[networkId];
  }
  const contract = new Contract(tokenAddr, erc20Abi, providers[networkId]);
  const symbol = await contract.symbol()
  return symbol;
}
  
export type TaskTime = {
  startTime: number;
  endTime: number;
}

export const getTaskTime = async(projectId: number, taskId: number, networkId: number): Promise<TaskTime|string> => {
  const taskParams = await actV1[networkId].tasks(projectId, taskId);
  console.log(`Project ${projectId}, Task ${taskId} parameters on ${networkId}:`);
  console.log(taskParams);

  return {
    startTime: parseInt(taskParams[1].toString()),
    endTime: parseInt(taskParams[2].toString()),
  }
}
