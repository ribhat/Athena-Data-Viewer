#THIS CODE IS NOT MEANT TO BE RUN HERE
#THIS IS THE CODE FOR THE LAMBDA MICROSERVICE THAT IS CALLED BY THE API

import json
import boto3
import time

def lambda_handler(event, context):
    # Extract query parameters from the event
    query_params = event.get('queryStringParameters', {})
    column = query_params.get('column')
    value = query_params.get('value')

    # Construct the query dynamically
    if column and value:
        query_string = f"SELECT * FROM test_bucket_12341 WHERE {column} = '{value}' LIMIT 10;"
    else:
        query_string = "SELECT * FROM test_bucket_12341 LIMIT 10;"  # Default query

    client = boto3.client('athena')

    # Start Query
    query_start = client.start_query_execution(
        QueryString=query_string,
        QueryExecutionContext={'Database': 'testdb'},
        ResultConfiguration={'OutputLocation': 's3://test-bucket-12341-results/'}
    )
    query_id = query_start['QueryExecutionId']

    # Wait for query to complete
    while True:
        query_status = client.get_query_execution(QueryExecutionId=query_id)
        status = query_status['QueryExecution']['Status']['State']
        if status in ['SUCCEEDED', 'FAILED', 'CANCELLED']:
            break
        time.sleep(2)

    if status != 'SUCCEEDED':
        error_message = query_status['QueryExecution']['Status'].get('StateChangeReason', 'Unknown error')
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': f"Query failed with status: {status}. Reason: {error_message}"})
        }

    # Fetch Results
    results = client.get_query_results(QueryExecutionId=query_id)
    rows = []
    for row in results['ResultSet']['Rows']:
        rows.append([col.get('VarCharValue') for col in row['Data']])

    # Return response
    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps(rows)
    }
