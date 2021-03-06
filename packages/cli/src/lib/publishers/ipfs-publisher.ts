// TODO: add own
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import IPFSClient from "ipfs-http-client";
const { globSource } = IPFSClient;

export async function publishToIPFS(buildPath: string, ipfs: string): Promise<string> {
  try {
    new URL(ipfs);
  } catch (e) {
    throw Error(`IPFS URL Malformed: ${ipfs}\n${e}`);
  }

  const client = new IPFSClient(ipfs);
  const globOptions = {
    recursive: true,
  };

  const addOptions = {
    wrapWithDirectory: false,
  };

  let rootCID = "";

  for await (const file of client.addAll(globSource(buildPath, globOptions), addOptions)) {
    if (file.path.indexOf("/") === -1) {
      rootCID = file.cid.toString();
    }
  }

  return rootCID;
}
