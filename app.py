from flask import Flask, request, jsonify
import boto3
from botocore.exceptions import BotoCoreError, ClientError
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend interaction

# Create an SQS client
sqs = boto3.client('sqs')

@app.route('/dlqs', methods=['GET'])
def get_dlqs():
    """Retrieve all Dead Letter Queues (DLQs) and their details."""
    try:
        response = sqs.list_queues()
        queue_urls = response.get('QueueUrls', [])

        dlqs = []
        for queue_url in queue_urls:
            attributes = sqs.get_queue_attributes(
                QueueUrl=queue_url,
                AttributeNames=['QueueArn', 'RedrivePolicy']
            )['Attributes']

            queue_arn = attributes.get('QueueArn', '')
            redrive_policy = attributes.get('RedrivePolicy', '{}')

            source_queue_arn = ''
            if redrive_policy:
                import json
                policy_data = json.loads(redrive_policy)
                source_queue_arn = policy_data.get('sourceQueueArn', '')

            dlqs.append({
                'queue_url': queue_url,
                'queue_arn': queue_arn,
                'source_queue_arn': source_queue_arn
            })

        return jsonify(dlqs)

    except (BotoCoreError, ClientError) as e:
        return jsonify({'error': str(e)}), 500

@app.route('/dlqs/redrive', methods=['POST'])
def redrive_messages():
    """Redrive messages from DLQs back to their source queues."""
    data = request.get_json()
    queues = data.get('queues', [])

    results = []
    for queue in queues:
        queue_url = queue['queue_url']
        source_queue_arn = queue['source_queue_arn']

        try:
            # Simulated redrive operation (modify based on your setup)
            results.append({
                'queue_url': queue_url,
                'status': 'Redriven successfully'
            })
        except (BotoCoreError, ClientError) as e:
            results.append({
                'queue_url': queue_url,
                'error': str(e)
            })

    return jsonify(results)

@app.route('/dlqs/purge', methods=['POST'])
def purge_queues():
    """Purge messages from selected DLQs."""
    data = request.get_json()
    queues = data.get('queues', [])

    results = []
    for queue in queues:
        queue_url = queue['queue_url']

        try:
            sqs.purge_queue(QueueUrl=queue_url)
            results.append({
                'queue_url': queue_url,
                'status': 'Purged successfully'
            })
        except (BotoCoreError, ClientError) as e:
            results.append({
                'queue_url': queue_url,
                'error': str(e)
            })

    return jsonify(results)

if __name__ == '__main__':
    app.run(debug=True)
