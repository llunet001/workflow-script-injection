#!/usr/bin/env python3
"""
DDoS Testing Script for Security Demo App
Educational purposes only - use only on systems you own or have permission to test
"""

import requests
import concurrent.futures
import time
import argparse
from datetime import datetime

def make_request(url, request_num, endpoint='/heavy-operation'):
    """Make a single request to the target"""
    start_time = time.time()
    try:
        target_url = f"{url}{endpoint}"
        response = requests.post(target_url, timeout=10)
        elapsed = time.time() - start_time
        return {
            'request_num': request_num,
            'status': response.status_code,
            'time': elapsed,
            'success': True
        }
    except requests.exceptions.Timeout:
        elapsed = time.time() - start_time
        return {
            'request_num': request_num,
            'status': 'TIMEOUT',
            'time': elapsed,
            'success': False
        }
    except Exception as e:
        elapsed = time.time() - start_time
        return {
            'request_num': request_num,
            'status': f'ERROR: {str(e)}',
            'time': elapsed,
            'success': False
        }

def run_ddos_test(url, num_requests=100, concurrency=10, endpoint='/heavy-operation'):
    """
    Run a DDoS simulation test
    
    Args:
        url: Target URL (e.g., http://1.2.3.4:3000)
        num_requests: Total number of requests to send
        concurrency: Number of concurrent workers
        endpoint: Target endpoint to attack
    """
    print("=" * 60)
    print("DDoS SIMULATION TEST")
    print("=" * 60)
    print(f"Target URL: {url}{endpoint}")
    print(f"Total Requests: {num_requests}")
    print(f"Concurrency: {concurrency}")
    print(f"Start Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    print()
    
    results = []
    start_time = time.time()
    
    # Run requests concurrently
    with concurrent.futures.ThreadPoolExecutor(max_workers=concurrency) as executor:
        futures = [
            executor.submit(make_request, url, i, endpoint)
            for i in range(num_requests)
        ]
        
        # Collect results as they complete
        for i, future in enumerate(concurrent.futures.as_completed(futures), 1):
            result = future.result()
            results.append(result)
            
            # Print progress every 10 requests
            if i % 10 == 0 or i == num_requests:
                print(f"Progress: {i}/{num_requests} requests completed "
                      f"({(i/num_requests)*100:.1f}%)")
    
    total_time = time.time() - start_time
    
    # Calculate statistics
    successful = [r for r in results if r['success']]
    failed = [r for r in results if not r['success']]
    
    if successful:
        avg_time = sum(r['time'] for r in successful) / len(successful)
        min_time = min(r['time'] for r in successful)
        max_time = max(r['time'] for r in successful)
    else:
        avg_time = min_time = max_time = 0
    
    # Print results
    print()
    print("=" * 60)
    print("RESULTS")
    print("=" * 60)
    print(f"Total Time: {total_time:.2f} seconds")
    print(f"Requests per Second: {num_requests/total_time:.2f}")
    print(f"Successful Requests: {len(successful)} ({len(successful)/num_requests*100:.1f}%)")
    print(f"Failed Requests: {len(failed)} ({len(failed)/num_requests*100:.1f}%)")
    print()
    print("Response Times:")
    print(f"  Average: {avg_time:.3f} seconds")
    print(f"  Minimum: {min_time:.3f} seconds")
    print(f"  Maximum: {max_time:.3f} seconds")
    print("=" * 60)
    
    # Show some error examples if any
    if failed:
        print()
        print("Sample Errors:")
        for i, result in enumerate(failed[:5], 1):
            print(f"  {i}. Request {result['request_num']}: {result['status']}")
        if len(failed) > 5:
            print(f"  ... and {len(failed) - 5} more errors")

def main():
    parser = argparse.ArgumentParser(
        description='DDoS Testing Tool for Security Demo App (Educational Use Only)'
    )
    parser.add_argument(
        'url',
        help='Target URL (e.g., http://1.2.3.4:3000)'
    )
    parser.add_argument(
        '-n', '--requests',
        type=int,
        default=100,
        help='Number of requests to send (default: 100)'
    )
    parser.add_argument(
        '-c', '--concurrency',
        type=int,
        default=10,
        help='Number of concurrent workers (default: 10)'
    )
    parser.add_argument(
        '-e', '--endpoint',
        default='/heavy-operation',
        help='Target endpoint (default: /heavy-operation)'
    )
    
    args = parser.parse_args()
    
    # Validate URL
    if not args.url.startswith('http'):
        print("Error: URL must start with http:// or https://")
        return
    
    # Warning message
    print()
    print("⚠️  WARNING: This tool sends multiple requests to a server.")
    print("   Only use this on systems you own or have explicit permission to test.")
    print()
    input("Press Enter to continue or Ctrl+C to cancel...")
    print()
    
    # Run the test
    run_ddos_test(
        url=args.url,
        num_requests=args.requests,
        concurrency=args.concurrency,
        endpoint=args.endpoint
    )

if __name__ == '__main__':
    main()
