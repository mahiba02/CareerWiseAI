import { Kafka, logLevel } from 'kafkajs';
import { logger } from './logger.js';

export interface BusMessage {
  topic: string;
  key?: string;
  value: any; // will be JSON.stringified
}

export interface MessageBus {
  produce(msg: BusMessage): Promise<void>;
  disconnect(): Promise<void>;
}

class ConsoleBus implements MessageBus {
  async produce(msg: BusMessage) {
    logger.debug({ topic: msg.topic, key: msg.key, value: msg.value }, 'ConsoleBus produce');
  }
  async disconnect() { /* noop */ }
}

class KafkaBus implements MessageBus {
  private kafka: Kafka;
  private producer: ReturnType<Kafka['producer']>;
  private connected = false;
  constructor(brokers: string[], clientId: string) {
    this.kafka = new Kafka({ clientId, brokers, logLevel: logLevel.NOTHING });
    this.producer = this.kafka.producer();
  }
  async ensure() {
    if (!this.connected) {
      await this.producer.connect();
      this.connected = true;
    }
  }
  async produce(msg: BusMessage) {
    await this.ensure();
    await this.producer.send({
      topic: msg.topic,
      messages: [{ key: msg.key, value: JSON.stringify(msg.value) }]
    });
  }
  async disconnect() {
    if (this.connected) await this.producer.disconnect();
    this.connected = false;
  }
}

export function createBus(env: { KAFKA_BROKERS?: string; KAFKA_CLIENT_ID?: string }): MessageBus {
  const brokers = env.KAFKA_BROKERS?.split(',').map(b => b.trim()).filter(Boolean) || [];
  if (!brokers.length || brokers[0].startsWith('dummy')) {
    logger.warn('Using ConsoleBus (no valid KAFKA_BROKERS provided)');
    return new ConsoleBus();
  }
  return new KafkaBus(brokers, env.KAFKA_CLIENT_ID || 'careerwise-ingestion');
}
