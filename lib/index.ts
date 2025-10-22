import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token'
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js'
import { serialize } from 'borsh'

export default class PinocchioBulkSender {
  constructor(
    public readonly programId: PublicKey,
    public readonly rpc: string,
  ) {}

  static SafeTransferParameters = {
    struct: {
      amount: 'u64',
    },
  }

  get connection() {
    return new Connection(this.rpc, { commitment: 'confirmed' })
  }

  createSafeTransferInstruction = async (
    payer: PublicKey,
    receiver: PublicKey,
    mint: PublicKey,
    amount: bigint,
    tokenProgram = TOKEN_PROGRAM_ID,
  ) => {
    const from = getAssociatedTokenAddressSync(
      mint,
      payer,
      true,
      tokenProgram,
      ASSOCIATED_TOKEN_PROGRAM_ID,
    )
    const to = getAssociatedTokenAddressSync(
      mint,
      payer,
      true,
      tokenProgram,
      ASSOCIATED_TOKEN_PROGRAM_ID,
    )

    const instructionDisc = Buffer.from([0])
    const instructionData = serialize(
      PinocchioBulkSender.SafeTransferParameters,
      { amount },
    )

    return new TransactionInstruction({
      keys: [
        {
          pubkey: payer,
          isSigner: true,
          isWritable: true,
        },
        {
          pubkey: from,
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: receiver,
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: to,
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: mint,
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: SystemProgram.programId,
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: tokenProgram,
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: ASSOCIATED_TOKEN_PROGRAM_ID,
          isSigner: false,
          isWritable: false,
        },
      ],
      programId: this.programId,
      data: Buffer.concat([instructionDisc, instructionData]),
    })
  }

  safeTransfer = async (
    payer: PublicKey,
    receiver: PublicKey,
    mint: PublicKey,
    amount: bigint,
    tokenProgram = TOKEN_PROGRAM_ID,
    signers: Keypair[] = [],
  ) => {
    const ix = await this.createSafeTransferInstruction(
      payer,
      receiver,
      mint,
      amount,
      tokenProgram,
    )
    const { blockhash, lastValidBlockHeight } =
      await this.connection.getLatestBlockhash()
    const messageV0 = new TransactionMessage({
      payerKey: payer,
      recentBlockhash: blockhash,
      instructions: [ix],
    }).compileToV0Message()

    const tx = new VersionedTransaction(messageV0)
    tx.sign(signers)

    const signature = await this.connection.sendTransaction(tx)
    await this.connection.confirmTransaction(
      {
        signature,
        blockhash,
        lastValidBlockHeight,
      },
      'confirmed',
    )
    return signature
  }
}
