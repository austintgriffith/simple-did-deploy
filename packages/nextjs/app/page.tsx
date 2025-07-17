"use client";

import { useState } from "react";
import Link from "next/link";
import type { NextPage } from "next";
import { bytesToHex, pad, stringToHex } from "viem";
import { useAccount } from "wagmi";
import {
  BugAntIcon,
  ClipboardDocumentListIcon,
  ExclamationCircleIcon,
  KeyIcon,
  MagnifyingGlassIcon,
  MinusIcon,
  PlusIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { Address, AddressInput } from "~~/components/scaffold-eth";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();

  // State for different operations
  const [identityToCheck, setIdentityToCheck] = useState("");
  const [newOwner, setNewOwner] = useState("");
  const [delegateAddress, setDelegateAddress] = useState("");
  const [delegateType, setDelegateType] = useState("");
  const [delegateValidity, setDelegateValidity] = useState("");
  const [attributeName, setAttributeName] = useState("");
  const [attributeValue, setAttributeValue] = useState("");
  const [attributeValidity, setAttributeValidity] = useState("");
  const [activeTab, setActiveTab] = useState("identity");

  // Read functions
  const { data: identityOwner } = useScaffoldReadContract({
    contractName: "EthereumDIDRegistry",
    functionName: "identityOwner",
    args: [identityToCheck || "0x0000000000000000000000000000000000000000"],
  });

  const { data: ownIdentityOwner } = useScaffoldReadContract({
    contractName: "EthereumDIDRegistry",
    functionName: "identityOwner",
    args: [connectedAddress || "0x0000000000000000000000000000000000000000"],
  });

  const { data: nonce } = useScaffoldReadContract({
    contractName: "EthereumDIDRegistry",
    functionName: "nonce",
    args: [connectedAddress || "0x0000000000000000000000000000000000000000"],
  });

  const { data: isValidDelegate } = useScaffoldReadContract({
    contractName: "EthereumDIDRegistry",
    functionName: "validDelegate",
    args: [
      identityToCheck || "0x0000000000000000000000000000000000000000",
      delegateType
        ? pad(stringToHex(delegateType), { size: 32 })
        : "0x0000000000000000000000000000000000000000000000000000000000000000",
      delegateAddress || "0x0000000000000000000000000000000000000000",
    ],
  });

  // Write functions
  const { writeContractAsync: writeEthereumDIDRegistry } = useScaffoldWriteContract({
    contractName: "EthereumDIDRegistry",
  });

  const handleChangeOwner = async () => {
    if (!connectedAddress || !newOwner) return;

    try {
      await writeEthereumDIDRegistry({
        functionName: "changeOwner",
        args: [connectedAddress, newOwner as `0x${string}`],
      });
      notification.success("Owner changed successfully!");
      setNewOwner("");
    } catch (error) {
      console.error("Error changing owner:", error);
      notification.error("Failed to change owner");
    }
  };

  const handleAddDelegate = async () => {
    if (!connectedAddress || !delegateAddress || !delegateType || !delegateValidity) return;

    try {
      const validitySeconds = BigInt(parseInt(delegateValidity) * 24 * 60 * 60); // Convert days to seconds
      await writeEthereumDIDRegistry({
        functionName: "addDelegate",
        args: [
          connectedAddress,
          pad(stringToHex(delegateType), { size: 32 }),
          delegateAddress as `0x${string}`,
          validitySeconds,
        ],
      });
      notification.success("Delegate added successfully!");
      setDelegateAddress("");
      setDelegateType("");
      setDelegateValidity("");
    } catch (error) {
      console.error("Error adding delegate:", error);
      notification.error("Failed to add delegate");
    }
  };

  const handleRevokeDelegate = async () => {
    if (!connectedAddress || !delegateAddress || !delegateType) return;

    try {
      await writeEthereumDIDRegistry({
        functionName: "revokeDelegate",
        args: [connectedAddress, pad(stringToHex(delegateType), { size: 32 }), delegateAddress as `0x${string}`],
      });
      notification.success("Delegate revoked successfully!");
      setDelegateAddress("");
      setDelegateType("");
    } catch (error) {
      console.error("Error revoking delegate:", error);
      notification.error("Failed to revoke delegate");
    }
  };

  const handleSetAttribute = async () => {
    if (!connectedAddress || !attributeName || !attributeValue || !attributeValidity) return;

    try {
      const validitySeconds = BigInt(parseInt(attributeValidity) * 24 * 60 * 60); // Convert days to seconds
      const valueBytes = new TextEncoder().encode(attributeValue);
      await writeEthereumDIDRegistry({
        functionName: "setAttribute",
        args: [
          connectedAddress,
          pad(stringToHex(attributeName), { size: 32 }),
          bytesToHex(valueBytes),
          validitySeconds,
        ],
      });
      notification.success("Attribute set successfully!");
      setAttributeName("");
      setAttributeValue("");
      setAttributeValidity("");
    } catch (error) {
      console.error("Error setting attribute:", error);
      notification.error("Failed to set attribute");
    }
  };

  const handleRevokeAttribute = async () => {
    if (!connectedAddress || !attributeName || !attributeValue) return;

    try {
      const valueBytes = new TextEncoder().encode(attributeValue);
      await writeEthereumDIDRegistry({
        functionName: "revokeAttribute",
        args: [connectedAddress, pad(stringToHex(attributeName), { size: 32 }), bytesToHex(valueBytes)],
      });
      notification.success("Attribute revoked successfully!");
      setAttributeName("");
      setAttributeValue("");
    } catch (error) {
      console.error("Error revoking attribute:", error);
      notification.error("Failed to revoke attribute");
    }
  };

  const TabButton = ({ id, label, icon: Icon }: { id: string; label: string; icon: any }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
        activeTab === id ? "bg-primary text-primary-content" : "bg-base-200 text-base-content hover:bg-base-300"
      }`}
    >
      <Icon className="h-5 w-5" />
      {label}
    </button>
  );

  return (
    <>
      <div className="flex items-center flex-col grow pt-10">
        <div className="px-5 w-full max-w-6xl">
          <h1 className="text-center">
            <span className="block text-2xl mb-2">Welcome to</span>
            <span className="block text-4xl font-bold">Ethereum DID Registry</span>
          </h1>

          <div className="flex justify-center items-center space-x-2 flex-col mb-8">
            <p className="my-2 font-medium">Connected Address:</p>
            <Address address={connectedAddress} />
            {connectedAddress && (
              <div className="text-center mt-2">
                <p className="text-sm text-gray-600">
                  Your Identity Owner:
                  <span className="font-mono ml-1">
                    <Address address={ownIdentityOwner} />
                  </span>
                </p>
                <p className="text-sm text-gray-600">Current Nonce: {nonce?.toString() || "0"}</p>
              </div>
            )}
          </div>

          {/* Tab Navigation */}
          <div className="flex justify-center gap-2 mb-8 flex-wrap">
            <TabButton id="identity" label="Identity" icon={UserIcon} />
            <TabButton id="delegates" label="Delegates" icon={KeyIcon} />
            <TabButton id="attributes" label="Attributes" icon={ClipboardDocumentListIcon} />
            <TabButton id="query" label="Query" icon={MagnifyingGlassIcon} />
          </div>

          {!connectedAddress && (
            <div className="alert alert-warning mb-8">
              <ExclamationCircleIcon className="h-6 w-6" />
              <span>Please connect your wallet to interact with the DID registry.</span>
            </div>
          )}

          {/* Identity Management Tab */}
          {activeTab === "identity" && (
            <div className="bg-base-200 p-6 rounded-3xl shadow-lg mb-8">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <UserIcon className="h-6 w-6" />
                Identity Management
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Transfer Identity Ownership</label>
                  <div className="flex gap-2 flex-wrap">
                    <AddressInput value={newOwner} onChange={setNewOwner} placeholder="New owner address" />
                    <button
                      onClick={handleChangeOwner}
                      className="btn btn-primary"
                      disabled={!connectedAddress || !newOwner}
                    >
                      Change Owner
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Delegates Tab */}
          {activeTab === "delegates" && (
            <div className="bg-base-200 p-6 rounded-3xl shadow-lg mb-8">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <KeyIcon className="h-6 w-6" />
                Delegate Management
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Add Delegate</label>
                  <div className="space-y-2">
                    <AddressInput
                      value={delegateAddress}
                      onChange={setDelegateAddress}
                      placeholder="Delegate address"
                    />
                    <input
                      type="text"
                      value={delegateType}
                      onChange={e => setDelegateType(e.target.value)}
                      placeholder="Delegate type (e.g., 'sigAuth', 'veriKey')"
                      className="input input-bordered w-full"
                    />
                    <input
                      type="number"
                      value={delegateValidity}
                      onChange={e => setDelegateValidity(e.target.value)}
                      placeholder="Validity period (days)"
                      className="input input-bordered w-full"
                    />
                    <button
                      onClick={handleAddDelegate}
                      className="btn btn-primary gap-2"
                      disabled={!connectedAddress || !delegateAddress || !delegateType || !delegateValidity}
                    >
                      <PlusIcon className="h-4 w-4" />
                      Add Delegate
                    </button>
                  </div>
                </div>

                <div className="divider"></div>

                <div>
                  <label className="block text-sm font-medium mb-2">Revoke Delegate</label>
                  <div className="space-y-2">
                    <AddressInput
                      value={delegateAddress}
                      onChange={setDelegateAddress}
                      placeholder="Delegate address"
                    />
                    <input
                      type="text"
                      value={delegateType}
                      onChange={e => setDelegateType(e.target.value)}
                      placeholder="Delegate type"
                      className="input input-bordered w-full"
                    />
                    <button
                      onClick={handleRevokeDelegate}
                      className="btn btn-error gap-2"
                      disabled={!connectedAddress || !delegateAddress || !delegateType}
                    >
                      <MinusIcon className="h-4 w-4" />
                      Revoke Delegate
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Attributes Tab */}
          {activeTab === "attributes" && (
            <div className="bg-base-200 p-6 rounded-3xl shadow-lg mb-8">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <ClipboardDocumentListIcon className="h-6 w-6" />
                Attribute Management
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Set Attribute</label>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={attributeName}
                      onChange={e => setAttributeName(e.target.value)}
                      placeholder="Attribute name (e.g., 'did/pub/Ed25519/veriKey/base64')"
                      className="input input-bordered w-full"
                    />
                    <textarea
                      value={attributeValue}
                      onChange={e => setAttributeValue(e.target.value)}
                      placeholder="Attribute value"
                      className="textarea textarea-bordered w-full"
                      rows={3}
                    />
                    <input
                      type="number"
                      value={attributeValidity}
                      onChange={e => setAttributeValidity(e.target.value)}
                      placeholder="Validity period (days)"
                      className="input input-bordered w-full"
                    />
                    <button
                      onClick={handleSetAttribute}
                      className="btn btn-primary gap-2"
                      disabled={!connectedAddress || !attributeName || !attributeValue || !attributeValidity}
                    >
                      <PlusIcon className="h-4 w-4" />
                      Set Attribute
                    </button>
                  </div>
                </div>

                <div className="divider"></div>

                <div>
                  <label className="block text-sm font-medium mb-2">Revoke Attribute</label>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={attributeName}
                      onChange={e => setAttributeName(e.target.value)}
                      placeholder="Attribute name"
                      className="input input-bordered w-full"
                    />
                    <textarea
                      value={attributeValue}
                      onChange={e => setAttributeValue(e.target.value)}
                      placeholder="Attribute value"
                      className="textarea textarea-bordered w-full"
                      rows={3}
                    />
                    <button
                      onClick={handleRevokeAttribute}
                      className="btn btn-error gap-2"
                      disabled={!connectedAddress || !attributeName || !attributeValue}
                    >
                      <MinusIcon className="h-4 w-4" />
                      Revoke Attribute
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Query Tab */}
          {activeTab === "query" && (
            <div className="bg-base-200 p-6 rounded-3xl shadow-lg mb-8">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <MagnifyingGlassIcon className="h-6 w-6" />
                Query DID Information
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Identity to Query</label>
                  <AddressInput
                    value={identityToCheck}
                    onChange={setIdentityToCheck}
                    placeholder="Identity address to query"
                  />
                </div>

                {identityToCheck && (
                  <div className="bg-base-300 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">Query Results:</h3>
                    <div className="space-y-2 text-sm">
                      <p>
                        <strong>Identity Owner:</strong> <Address address={identityOwner} />
                      </p>

                      {delegateAddress && delegateType && (
                        <p>
                          <strong>Is Valid Delegate:</strong>
                          <span
                            className={`ml-2 px-2 py-1 rounded text-xs ${
                              isValidDelegate ? "bg-success text-success-content" : "bg-error text-error-content"
                            }`}
                          >
                            {isValidDelegate ? "Valid" : "Invalid/Expired"}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">Check Delegate Validity</label>
                  <div className="space-y-2">
                    <AddressInput
                      value={delegateAddress}
                      onChange={setDelegateAddress}
                      placeholder="Delegate address"
                    />
                    <input
                      type="text"
                      value={delegateType}
                      onChange={e => setDelegateType(e.target.value)}
                      placeholder="Delegate type"
                      className="input input-bordered w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grow bg-base-300 w-full mt-16 px-8 py-12">
          <div className="flex justify-center items-center gap-12 flex-col md:flex-row">
            <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center max-w-xs rounded-3xl">
              <BugAntIcon className="h-8 w-8 fill-secondary" />
              <p>
                Tinker with your DID registry using the{" "}
                <Link href="/debug" passHref className="link">
                  Debug Contracts
                </Link>{" "}
                tab.
              </p>
            </div>
            <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center max-w-xs rounded-3xl">
              <MagnifyingGlassIcon className="h-8 w-8 fill-secondary" />
              <p>
                Explore your DID transactions with the{" "}
                <Link href="/blockexplorer" passHref className="link">
                  Block Explorer
                </Link>{" "}
                tab.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
