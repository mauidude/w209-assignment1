from flask import Flask, render_template

app = Flask(__name__)


@app.route('/assignment2')
def index():
    return render_template('assignment2.html')


if __name__ == '__main__':
    app.run()
