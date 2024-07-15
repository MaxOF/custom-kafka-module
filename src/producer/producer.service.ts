import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Kafka, Producer, RecordMetadata, Admin, SeekEntry, Offsets } from 'kafkajs';
import { Serializer } from '@nestjs/microservices';
import { Logger } from '@nestjs/common/services/logger.service';
import { KafkaLogger } from '@nestjs/microservices/helpers/kafka-logger';
import { KafkaModuleOption, KafkaMessageSend, KafkaTransaction } from '../interfaces';

import { KafkaRequestSerializer } from '../serializer/kafka-request.serializer';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
	private kafka: Kafka;
	private producer: Producer;
	private admin: Admin;
	private serializer: Serializer;
	private autoConnect: boolean;

	protected topicOffsets: Map<string, (SeekEntry & { high: string; low: string })[]> =
		new Map();

	protected logger = new Logger(KafkaService.name);

	constructor(options: KafkaModuleOption['options']) {
		const { client, producer: producerConfig } = options;

		this.kafka = new Kafka({
			...client,
			logCreator: KafkaLogger.bind(null, this.logger)
		});

		this.autoConnect = options.autoConnect ?? true;
		this.producer = this.kafka.producer(producerConfig);
		this.admin = this.kafka.admin();

		this.initializeSerializer(options);
	}

	async onModuleInit(): Promise<void> {
		await this.connect();
	}

	async onModuleDestroy(): Promise<void> {
		await this.disconnect();
	}

	/**
	 * Connect the kafka service.
	 */
	async connect(): Promise<void> {
		if (!this.autoConnect) {
			return;
		}

		await this.producer.connect();
		await this.admin.connect();
	}

	/**
	 * Disconnects the kafka service.
	 */
	async disconnect(): Promise<void> {
		await this.producer.disconnect();
		await this.admin.disconnect();
	}

	/**
	 * Send/produce a message to a topic.
	 *
	 * @param message
	 */
	async send(message: KafkaMessageSend): Promise<RecordMetadata[]> {
		if (!this.producer) {
			this.logger.error('There is no producer, unable to send message.');
			return;
		}

		const serializedPacket = await this.serializer.serialize(message);

		// @todo - rather than have a producerRecord,
		// most of this can be done when we create the controller.
		return await this.producer.send(serializedPacket);
	}

	/**
	 * Gets the groupId suffix for the consumer.
	 *
	 * @param groupId
	 */
	public getGroupIdSuffix(groupId: string): string {
		return groupId + '-client';
	}

	/**
	 * Returns a new producer transaction in order to produce messages and commit offsets together
	 */
	async transaction(): Promise<KafkaTransaction> {
		const producer = this.producer;
		if (!producer) {
			const msg = 'There is no producer, unable to start transactions.';
			this.logger.error(msg);
			throw msg;
		}

		const tx = await producer.transaction();
		const retval: KafkaTransaction = {
			abort(): Promise<void> {
				return tx.abort();
			},
			commit(): Promise<void> {
				return tx.commit();
			},
			isActive(): boolean {
				return tx.isActive();
			},
			async send(message: KafkaMessageSend): Promise<RecordMetadata[]> {
				const serializedPacket = await this.serializer.serialize(message);
				return await tx.send(serializedPacket);
			},
			sendOffsets(offsets: Offsets & { consumerGroupId: string }): Promise<void> {
				return tx.sendOffsets(offsets);
			}
		};
		return retval;
	}

	/**
	 * Sets up the serializer to encode outgoing messages.
	 *
	 * @param options
	 */
	protected initializeSerializer(options: KafkaModuleOption['options']): void {
		this.serializer = (options && options.serializer) || new KafkaRequestSerializer();
	}
}
